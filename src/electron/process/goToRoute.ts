// Goes to the provided route.
export const goToRoute = (route, browserWindow) => {
    let pathInUrl = '';
    if (route.startsWith('/')) {
        pathInUrl = route.slice(1).replaceAll(' ', '_');
    } else {
        pathInUrl = route.replaceAll(' ', '_');
    }
    // TODO fix this for production
    browserWindow.loadURL(
        // isDev
        // ?
        `http://localhost:3300/${pathInUrl}`
        // : `file://${path.join(__dirname, '../build/index.html')}`
    );
};
