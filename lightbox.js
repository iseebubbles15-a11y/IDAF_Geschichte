// Bilder in .figure per Klick vergrössern, schliessen mit Klick oder Escape
const lightbox = document.createElement("div");
lightbox.className = "lightbox";
lightbox.hidden = true;
lightbox.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure>';
document.body.appendChild(lightbox);

const lightboxImage = lightbox.querySelector("img");
const lightboxCaption = lightbox.querySelector("figcaption");

function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
}

document.querySelectorAll(".figure img").forEach(image => {
    image.tabIndex = 0;
    image.title = "Zum Vergrössern klicken";

    const open = () => {
        const caption = image.closest("figure").querySelector("figcaption");
        lightboxImage.src = image.src;
        lightboxImage.alt = image.alt;
        lightboxCaption.innerHTML = caption ? caption.innerHTML : "";
        lightbox.hidden = false;
        document.body.classList.add("lightbox-open");
    };

    image.addEventListener("click", open);
    image.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open();
        }
    });
});

lightbox.addEventListener("click", closeLightbox);
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !lightbox.hidden) {
        closeLightbox();
    }
});
