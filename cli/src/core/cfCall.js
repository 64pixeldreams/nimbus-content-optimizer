import https from "node:https";
import http from "node:http";
import { getApiBaseUrl, getApiKey } from "./config.js";

function doRequest(url, body, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const isHttps = u.protocol === "https:";
    const lib = isHttps ? https : http;
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (isHttps ? 443 : 80),
        path: u.pathname + (u.search || ""),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data || "{}");
            resolve({ status: res.statusCode || 0, data: json });
          } catch (err) {
            resolve({ status: res.statusCode || 0, data: null, raw: data });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export async function cfCall(paths, action, payload, options = {}) {
  const apiKey = options.apiKey || getApiKey(paths);
  if (!apiKey) {
    throw new Error("Missing API key. Run: nimbus set-api-key <KEY>");
  }
  const baseUrl = options.apiUrl || getApiBaseUrl(paths);
  const url = `${baseUrl.replace(/\/$/, "")}/api/function`;
  const body = JSON.stringify({ action, payload });
  const headers = { Authorization: `Bearer ${apiKey}` };
  const res = await doRequest(url, body, headers);
  if (res.status >= 400) {
    throw new Error(`HTTP ${res.status}: ${res.raw || JSON.stringify(res.data)}`);
  }
  let result = res.data || {};
  if (result.success === false) {
    throw new Error(result.error || "Request failed");
  }
  // Normalize nested CloudFunction payloads: { success, data: { success, data } }
  if (result && typeof result === "object" && result.data) {
    const inner = result.data;
    if (inner && typeof inner === "object" && Object.prototype.hasOwnProperty.call(inner, "data")) {
      result = { ...result, data: inner.data };
    }
  }
  return result;
}

