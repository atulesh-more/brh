const staticDevCoffee = "msf-portal-v1";
const assets = [
  "/",
  "/index.html",
  "/styles/style.css",
  "/scripts/events.js",
  "/scripts/router.js",
  "/scripts/main.js",
  "/favicon.ico",
  "/pages/about.html",
  "/pages/contact.html",
  "/pages/home.html",
  "/pages/login.html",
  "/pages/register.html",
  "/pages/programs.html",
  "/pages/services.html",
  "/pages/subscription.html",
  "/pages/payment.html",
  "/pages/affiliate.html",
  "/pages/myaccount.html",
  "/pages/conference.html",
  "/pages/conference_header.html",
  "/pages/subscription_header.html",

  "/pages/login_header.html",

  "/pages/privacy.html",
  "/pages/home_header.html",
  "/pages/privacy_header.html",
  "/pages/disclaimer_header.html",
];

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticDevCoffee).then(cache => {
      cache.addAll(assets);
    })
  );
});

self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request);
    })
  );
});