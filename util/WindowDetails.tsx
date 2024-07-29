function windowDetails() {
    // Get the current URL
    const currentUrl = window.location.href;

    // Get the referrer URL
    const referrerUrl = document.referrer;

    // Get the user agent string
    const userAgent = window.navigator.userAgent;

    // Get the viewport width and height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get the screen resolution
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    // Get the document title
    const documentTitle = document.title;

    // Get the browser language
    const browserLanguage = window.navigator.language;

    // Get the platform (OS)
    const platform = window.navigator.platform;

    // Get the number of plugins
    const numPlugins = window.navigator.plugins.length;

    // Get cookie enabled status
    const cookiesEnabled = window.navigator.cookieEnabled;

    // Get the color depth of the screen
    const colorDepth = window.screen.colorDepth;

    // Get the pixel depth of the screen
    const pixelDepth = window.screen.pixelDepth;

    // Get the hostname
    const hostname = window.location.hostname;

    // Get the protocol
    const protocol = window.location.protocol;

    // Get the path
    const path = window.location.pathname;

    // Get the search query string
    const searchQuery = window.location.search;

    // Compile the analytical data into an object
    const analyticalData = {
        currentUrl: currentUrl,
        referrerUrl: referrerUrl,
        userAgent: userAgent,
        viewportWidth: viewportWidth,
        viewportHeight: viewportHeight,
        screenWidth: screenWidth,
        screenHeight: screenHeight,
        documentTitle: documentTitle,
        browserLanguage: browserLanguage,
        platform: platform,
        numPlugins: numPlugins,
        cookiesEnabled: cookiesEnabled,
        colorDepth: colorDepth,
        pixelDepth: pixelDepth,
        hostname: hostname,
        protocol: protocol,
        path: path,
        searchQuery: searchQuery,
    };
    return analyticalData
}

export default windowDetails