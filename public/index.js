// This file provides a way for GitHub Pages to redirect all 404s back to index.html
// It's used by the 404.html page
(function () {
  if (document.location.href.indexOf("gh-pages-redirect") > -1) {
    // Parse the current URL
    const url = new URL(window.location.href);
    const redirect = url.searchParams.get("redirect");
    if (redirect) {
      // Remove the gh-pages-redirect parameter from the URL
      window.history.replaceState({}, document.title, redirect);
    }
  }
})();
