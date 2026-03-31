// import "server-only"
import { URL } from "url";
import { resolve4, resolve6 } from "dns/promises";

function isPrivateIpV4(ip: string): boolean {
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
        (a >= 224 && a <= 255)
    ) return true;
    
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

    const webUrl = new URL(url);

    if (!webUrl) return null;

    console.log("Se ha creado correctamente el objeto URL")

    if (webUrl.protocol !== "https:") return null;

    console.log("El protocolo es https")

    const test = await resolve4(webUrl.hostname);
    // resolve6

    console.log("dns-resolve4 test:", test)


    return null;
}

// void saveImageInVercelBlob("https://nbamon.gonzalopozo.dev/");