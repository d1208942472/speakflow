const API_HOSTNAME = "speakflow-api.onrender.com";
const STATIC_SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "SAMEORIGIN",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

function hasFileExtension(pathname) {
  const lastSegment = pathname.split("/").pop() || "";
  return lastSegment.includes(".");
}

function withPath(url, pathname) {
  const next = new URL(url.toString());
  next.pathname = pathname;
  return next;
}

async function fetchStaticAsset(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const candidates = [];

  if (pathname === "/") {
    candidates.push("/index.html");
  } else {
    if (pathname.endsWith("/")) {
      candidates.push(`${pathname}index.html`);
    }
    if (!hasFileExtension(pathname)) {
      candidates.push(`${pathname}.html`);
      candidates.push(`${pathname}/index.html`);
    }
    candidates.push(pathname);
  }

  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    const assetResponse = await env.ASSETS.fetch(new Request(withPath(url, candidate), request));
    if (assetResponse.status !== 404) {
      const response = new Response(assetResponse.body, assetResponse);
      for (const [name, value] of Object.entries(STATIC_SECURITY_HEADERS)) {
        response.headers.set(name, value);
      }
      return response;
    }
  }

  const notFoundResponse = await env.ASSETS.fetch(
    new Request(withPath(url, "/404.html"), request),
  );
  if (notFoundResponse.status !== 404) {
    const response = new Response(notFoundResponse.body, notFoundResponse);
    response.status = 404;
    for (const [name, value] of Object.entries(STATIC_SECURITY_HEADERS)) {
      response.headers.set(name, value);
    }
    return response;
  }

  return new Response("Not Found", { status: 404, headers: STATIC_SECURITY_HEADERS });
}

async function proxyApiRequest(request) {
  const url = new URL(request.url);
  url.protocol = "https:";
  url.hostname = API_HOSTNAME;
  url.port = "";

  const upstreamRequest = new Request(url.toString(), request);
  upstreamRequest.headers.set("x-forwarded-host", new URL(request.url).host);
  upstreamRequest.headers.set("x-forwarded-proto", "https");

  const response = await fetch(upstreamRequest, {
    redirect: "manual",
  });

  const proxiedResponse = new Response(response.body, response);
  proxiedResponse.headers.set("x-served-by", "speakmeteor-edge");
  return proxiedResponse;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { hostname } = url;
    if (hostname === "api.speakmeteor.win") {
      return proxyApiRequest(request);
    }

    if (hostname === "www.speakmeteor.win") {
      url.hostname = "speakmeteor.win";
      return Response.redirect(url.toString(), 308);
    }

    return fetchStaticAsset(request, env);
  },
};
