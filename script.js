function imgSlider (anything){
    document.querySelector('.sushiswap').src = anything
}

function changeCirculoColor(color){
    const circulo = document.querySelector('.circulo');
    circulo.style.background = color
}

function toggleMenu(){
    var menuToggle = document.querySelector('.toggle');
    var navegacion = document.querySelector('.navegacion')
    menuToggle.classList.toggle('active')
    navegacion.classList.toggle('active')
}