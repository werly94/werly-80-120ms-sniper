"use strict";

const tls = require("tls");
const WebSocket = require("ws");
const extractJsonFromString = require("extract-json-from-string");

let vanity;
const guilds = {};
const a = ""; // token 
const l = ""; // token
const s = ""; // sunucu id
const i = "";// kanal

const tlsSocket = tls.connect({
    host: "canary.discord.com",
    port: 443,
});

tlsSocket.on("data", async (data) => {
    const ext = await extractJsonFromString(data.toString());
    const find = ext.find((e) => e.code) || ext.find((e) => e.message);

    if (find) {
       
        const requestBody = JSON.stringify({
            content: vanity,
        });

        const contentLength = Buffer.byteLength(requestBody);
        const requestHeader = [
            `POST /api/channels/${i}/messages HTTP/1.1`,
            "Host: canary.discord.com",
            `Authorization: ${l}`,
            "Content-Type: application/json",
            `Content-Length: ${contentLength}`,
            "",
            "",
        ].join("\r\n");

        const request = requestHeader + requestBody;
        tlsSocket.write(request);

        
        
    }
});

tlsSocket.on("error", (error) => {
    console.log(`tls error`, error);
    return process.exit();
});

tlsSocket.on("end", () => {
    console.log("tls connection closed");
    return process.exit();
});

tlsSocket.on("secureConnect", () => {
    const websocket = new WebSocket("wss://gateway.discord.gg/");

    websocket.onclose = (event) => {
        console.log(`ws connection closed ${event.reason} ${event.code}`);
        return process.exit();
    };

    websocket.onmessage = async (message) => {
        const { d, op, t } = JSON.parse(message.data);

        if (t === "GUILD_UPDATE") {
            const start = process.hrtime();
            const find = guilds[d.guild_id];
            if (find && find !== d.vanity_url_code) {
                const requestBody = JSON.stringify({ code: find });
                tlsSocket.write(`PATCH /api/v7/guilds/${s}/vanity-url HTTP/1.1\r\nHost: canary.discord.com\r\nAuthorization: ${a}\r\nContent-Type: application/json\r\nContent-Length: ${requestBody.length}\r\n\r\n${requestBody}`);
                const end = process.hrtime(start);
                const elapsedMillis = end[0] * 1000 + end[1] / 1e6;
                vanity = `${find} ${elapsedMillis.toFixed(3)} `;
console.log(`${find} ${elapsedMillis.toFixed(3)} `);
            }
            
        } else if (t === "READY") {
            d.guilds.forEach((guild) => {
                if (guild.vanity_url_code) {
                    guilds[guild.id] = guild.vanity_url_code;
                }
            });
            console.log(guilds);
        }

        if (op === 10) {
            websocket.send(JSON.stringify({
                op: 2,
                d: {
                    token: l,
                    intents: 1,
                    properties: {
                        os: "linux",
                        browser: "firefox",
                        device: "firefox",
                    },
                },
            }));
            setInterval(() => websocket.send(JSON.stringify({ op: 0.8, d: {}, s: null, t: "heartbeat" })), d.heartbeat_interval);
        } else if (op === 7) {
            return process.exit();
        }
    };

    setInterval(() => {
        tlsSocket.write("GET / HTTP/1.1\r\nHost: canary.discord.com\r\n\r\n");
    }, 600);
});
