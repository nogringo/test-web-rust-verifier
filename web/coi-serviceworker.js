/*! coi-serviceworker v0.1.7 - Guido Zuidhof and contributors, licensed under MIT */
let coepCredentialless = false;
if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

    self.addEventListener("message", (ev) => {
        if (!ev.data) {
            return;
        } else if (ev.data.type === "deregister") {
            self.registration
                .unregister()
                .then(() => {
                    return self.clients.matchAll();
                })
                .then((clients) => {
                    clients.forEach((client) => client.navigate(client.url));
                });
        } else if (ev.data.type === "coepCredentialless") {
            coepCredentialless = ev.data.value;
        }
    });

    self.addEventListener("fetch", function (event) {
        const r = event.request;
        if (r.cache === "only-if-cached" && r.mode !== "same-origin") {
            return;
        }

        const request = (coepCredentialless && r.mode === "no-cors")
            ? new Request(r, {
                credentials: "omit",
            })
            : r;

        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.status === 0) {
                        return response;
                    }

                    const newHeaders = new Headers(response.headers);
                    newHeaders.set("Cross-Origin-Embedder-Policy",
                        coepCredentialless ? "credentialless" : "require-corp"
                    );
                    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    });
                })
                .catch((e) => console.error(e))
        );
    });

} else {
    (() => {
        // If already cross-origin isolated, do nothing
        if (window.crossOriginIsolated) {
            console.log("Cross-Origin-Isolated is already active.");
            return;
        }

        if (!navigator.serviceWorker) {
            console.error("Service Worker is not supported.");
            return;
        }

        // Always try to register/update the service worker when not isolated
        navigator.serviceWorker.register(window.document.currentScript.src).then(
            (registration) => {
                console.log("Service Worker registered", registration.scope);

                registration.addEventListener("updatefound", () => {
                    console.log("Service Worker update found, reloading...");
                    window.location.reload();
                });

                // If the registration is active, but it's not controlling the page
                if (registration.active && !navigator.serviceWorker.controller) {
                    console.log("Service Worker active but not controlling, reloading...");
                    window.location.reload();
                }

                // If we have a controller but still not isolated, reload
                if (navigator.serviceWorker.controller && !window.crossOriginIsolated) {
                    console.log("Service Worker controlling but not isolated, reloading...");
                    window.location.reload();
                }
            },
            (err) => {
                console.error("Service Worker registration failed:", err);
            }
        );
    })();
}
