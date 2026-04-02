// import "server-only"
import { URL } from "url";
import { resolve4, resolve6 } from "dns/promises";
import * as cheerio from "cheerio";

/**
 * Retorna true/false dependiendo de si la dirección IP es invalida o valida respectivamente.
 * @param ip Dirección IP recibida
 * @returns Retorna true si es una IP invalida y false si es valida.
 */
function isInvalidIpV4(ip: string): boolean {
    const octects = ip.split(".").map(Number);
    if (octects.length !== 4 || octects.some((p) => isNaN(p))) return true;

    const [a, b, c] = octects; 

    if (
        (a === 0) ||
        (a === 10) ||
        ((a === 100) && (b >= 64 && b <= 127)) ||
        (a === 127) ||
        ((a === 169) && (b === 254)) ||
        ((a === 172) && (b >= 16 && b <= 31)) ||
        ((a === 192) && (b === 0) && (c === 0)) ||
        ((a === 192) && (b === 0) && (c === 2)) ||
        ((a === 192) && (b === 88) && (c === 99)) ||
        ((a === 192) && (b === 168)) ||
        ((a === 198) && (b >= 18 && b <= 19)) ||
        ((a === 198) && (b === 51) && (c === 100)) ||
        ((a === 203) && (b === 0) && (c === 113)) ||
        (a >= 224)
    ) return true;

    return false;
}

function isInvalidIpV6(ip: string): boolean {
    if (ip.split("::").length > 2) return true;

    let ipFilled;

    if (ip.includes("::")) {
        const ipSplited = ip.split("::");
    
        const leftIpPart = ipSplited[0].split(":");
        const rightIpPart = ipSplited[1].split(":");
    
        const leftGroupsCount = ((leftIpPart.length === 1) && (leftIpPart[0] === "")) ? 0 : leftIpPart.length;
        const rightGroupsCount = ((rightIpPart.length === 1) && (rightIpPart[0] === "")) ? 0 : rightIpPart.length;
    
        const zeroGroupsToAdd = 8 - leftGroupsCount - rightGroupsCount;
    
        let zerosFiller = "";
    
        if (leftGroupsCount !== 0) zerosFiller += ":";
        for (let i = 0; i < zeroGroupsToAdd; i++) {
            zerosFiller += "0:"
        }
        if (rightGroupsCount === 0) zerosFiller = zerosFiller.slice(0, -1)
    
        ipFilled = ip.replaceAll("::", zerosFiller);
    } else ipFilled = ip;

    const groups = ipFilled.split(":").map(octect => parseInt(octect, 16));
    if (groups.length !== 8 || groups.some((p) => isNaN(p))) return true;

    const [g0, g1, g2, g3, g4, g5, g6, g7] = groups; 

    if (
        ((g0 === 0) && (g1 === 0) && (g2 === 0) && (g3 === 0) && (g4 === 0) && (g5 === 0) && (g6 === 0) && (g7 >= 0 && g7 <= 1)) ||
        ((g0 === 100) && (g1 === 65435) && (g2 === 1)) ||
        ((g0 === 256) && (g1 === 0) && (g2 === 0) && (g3 === 0)) || 
        ((g0 === 8193) && (g1 === 0)) || 
        ((g0 === 8193) && (g1 === 2)) || 
        ((g0 === 8193) && (g1 >= 16 && g1 <= 31)) || 
        ((g0 === 8193) && (g1 === 3512)) || 
        (g0 === 8194) || 
        (g0 >= 64512 && g0 <= 65023) || 
        (g0 >= 65152 && g0 <= 65215) || 
        (g0 >= 65280)  
    ) return true;

    if (
        ((g0 === 0) && (g1 === 0) && (g2 === 0) && (g3 === 0) && (g4 === 0) && (g5 === 65535)) ||
        ((g0 === 100) && (g1 === 65435) && (g2 === 0) && (g3 === 0) && (g4 === 0) && (g5 === 0))
    ) {
        const octet1 = g6 >> 8;
        const octet2 = g6 & 255;
        const octet3 = g7 >> 8;
        const octet4 = g7 & 255;

        const extracedIpV4 = `${octet1}.${octet2}.${octet3}.${octet4}`

        if (isInvalidIpV4(extracedIpV4)) return true;
    }

    return false;
}


/**
 * Guarda la imagen en el storage (Vercel Blob)
 * @param url El url de la página la cual queremos obtener su open-graph image
 * @returns El string con la dirección de la imagen guarda en nuestro storage (Vercel Blob) o null si falla
 */
export async function saveImageInVercelBlob(url: string): Promise<string | null> {
    console.log("URL original:", url)
    if (!URL.canParse(url)) return null;

    console.log("El url es parseable")

    let webUrl;
    try { webUrl = new URL(url) } catch { return null };

    console.log("Se ha creado correctamente el objeto URL")

    if (webUrl.protocol !== "https:") return null;

    console.log("El protocolo es https")

    const revolvedIpsV4  = await resolve4(webUrl.hostname);

    for (const ip of revolvedIpsV4) {
        if (isInvalidIpV4(ip)) return null;
    }

    console.log("Todas las IPs V4 son validas");

    const revolvedIpsV6  = await resolve6(webUrl.hostname);

    for (const ip of revolvedIpsV6) {
        if (isInvalidIpV6(ip)) return null;
    }

    console.log("Todas las IPs V6 son validas");

    let response;

    console.log("Hacinedo fetch de la web...")

    try {
        response = await fetch(webUrl.toString(), {
            redirect: "error",
            signal: AbortSignal.timeout(5_000)
        });
    } catch {
        return null;
    }

    console.log("La web no nos intenteta redireccionar ni ha superiado el timeout de 5 segundos");

    if (!response.ok) return null;

    console.log("La respuesta del fetch fue exitosa");

    const responseContentType = response.headers.get("content-type");
    if (!responseContentType?.toLowerCase().includes("text/html")) return null;

    console.log("El content-type de la respuesta es text/html");

    const responseContentLength = response.headers.get("content-length");
    if (responseContentLength !== null) {
        const n = Number(responseContentLength);
        if (Number.isFinite(n) && n > 5 * 1024 * 1024) return null;
        console.log("El content-length de la respuesta es menor que 5 MB");
    }

    const html = await response.text();
    if (html.length > 5 * 1024 * 1024) return null;
    console.log("El contenido (html) de la respuesta es menor que 5 MB");

    const htmlPage = cheerio.load(html);
    const htmlMetaTag = htmlPage(`meta[property="og:image"]`).length > 0 ? htmlPage(`meta[property="og:image"]`) : htmlPage(`meta[name="og:image"]`).length > 0 ? htmlPage(`meta[name="og:image"]`) : null;
    if (!htmlMetaTag) return null;

    console.log(`Cargamos la web y tiene un tag meta con property/name "og:image"`);

    const ogImageUrl = htmlMetaTag.attr("content");
    if (!ogImageUrl) return null;

    console.log("El tag meta contiene un atributo content");

    let ogImageNormalizedUrl;
    try { ogImageNormalizedUrl = new URL(ogImageUrl, webUrl) } catch { return null }

    console.log("Se ha creado correctamente el objeto URL para el link de la open-graph image");

    if (ogImageNormalizedUrl.protocol !== "https:") return null;

    console.log("El protocolo del link de la open-graph image es https");

    return null;
}

void saveImageInVercelBlob("https://nbamon.gonzalopozo.dev/");