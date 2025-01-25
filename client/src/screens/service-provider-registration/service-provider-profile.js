const reloadButton = document.getElementById('reload__button');

reloadButton.addEventListener('click', () => {
    let profileImage = document.getElementById('profile__image');
    let imagePath = document.getElementById("image__path").value;

    console.log(profileImage);
    console.log(imagePath);
    
    profileImage.src = `${imagePath}`;
})