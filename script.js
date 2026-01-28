function menuOnClick() {
  document.getElementById("menu-bar").classList.toggle("change");
  document.getElementById("nav").classList.toggle("change");
  document.getElementById("menu-bg").classList.toggle("change-bg");
}


function toggleBox(element) {
  element.classList.toggle("aberto");
  box.querySelector('.catraca')?.classList.toggle('girado');
}

document.querySelector('.catraca').addEventListener('click', function () {
  this.classList.toggle('girado');
});
