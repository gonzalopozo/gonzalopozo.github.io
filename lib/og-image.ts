// import "server-only"
import { URL } from "url";
import { resolve4, resolve6 } from "dns/promises";

function isPrivateIpV4(ip: string): boolean {
    const invalidIps = [
        "0",
        "0.",
        "10",
        [
            "100.64",
            "100.65",
            "100.66",
            "100.67",
            "100.68",
            "100.69",
            "100.70",
            "100.71",
            "100.72",
            "100.73",
            "100.74",
            "100.75",
            "100.76",
            "100.77",
            "100.78",
            "100.79",
            "100.80",
            "100.81",
            "100.82",
            "100.83",
            "100.84",
            "100.85",
            "100.86",
            "100.87",
            "100.88",
            "100.89",
            "100.90",
            "100.91",
            "100.92",
            "100.93",
            "100.94",
            "100.95",
            "100.96",
            "100.97",
            "100.98",
            "100.99",
            "100.100",
            "100.101",
            "100.102",
            "100.103",
            "100.104",
            "100.105",
            "100.106",
            "100.107",
            "100.108",
            "100.109",
            "100.110",
            "100.111",
            "100.112",
            "100.113",
            "100.114",
            "100.115",
            "100.116",
            "100.117",
            "100.118",
            "100.119",
            "100.120",
            "100.121",
            "100.122",
            "100.123",
            "100.124",
            "100.125",
            "100.126",
            "100.127"
        ],
        "127",
        "169.254",
        [
            "172.16",
            "172.17",
            "172.18",
            "172.19",
            "172.20",
            "172.21",
            "172.22",
            "172.23",
            "172.24",
            "172.25",
            "172.26",
            "172.27",
            "172.28",
            "172.29",
            "172.30",
            "172.31"
        ],
        "192.0.0",
        "192.0.2",
        "192.88.99",
        "192.168",
        "198.18",
        "198.19",
        "198.51.100",
        "203.0.113",
        [
            "224",
            "225",
            "226",
            "227",
            "228",
            "229",
            "230",
            "231",
            "232",
            "233",
            "234",
            "235",
            "236",
            "237",
            "238",
            "239"
        ],
        [
            "240",
            "241",
            "242",
            "243",
            "244",
            "245",
            "246",
            "247",
            "248",
            "249",
            "250",
            "251",
            "252",
            "253",
            "254",
            "255"
        ]
    ];

    for (const invalidIp of invalidIps) {
        if (Array.isArray(invalidIp)) {
            for (const invalidIp2 of invalidIp) {
                if (ip.startsWith(invalidIp2)) return true;
            }
        } else {
            if (ip.startsWith(invalidIp)) return true;
        }
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