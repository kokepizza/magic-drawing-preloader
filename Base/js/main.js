function viewTransition() {
    const links = document.querySelectorAll('.navigation .nav-link');

    links.forEach(link => {
        link.addEventListener('click', async (event) => {
            event.preventDefault();

                document.startViewTransition(async () => {
                    const response = await fetch(link.href);
                    const html = await response.text();
                    const doc = new DOMParser().parseFromString(html, "text/html");
                    document.body.innerHTML = doc.body.innerHTML;
                    history.pushState(null, "", link.href);
                    viewTransition();
                });
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    viewTransition();
});