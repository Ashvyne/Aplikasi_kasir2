document.addEventListener('DOMContentLoaded', function() {
  const pinjamButton = document.getElementById('pinjamButton');
  const borrowModal = document.getElementById('borrowModal');
  const closeModal = document.getElementById('closeModal');
  const confirmBorrow = document.getElementById('confirmBorrow');

  if (pinjamButton) {
    pinjamButton.addEventListener('click', function() {
      borrowModal.style.display = 'flex';
    });
  }
  if (closeModal) {
    closeModal.addEventListener('click', function() {
      borrowModal.style.display = 'none';
    });
  }
  if (confirmBorrow) {
    confirmBorrow.addEventListener('click', function() {
      // TODO: Add borrow logic here
      borrowModal.style.display = 'none';
    });
  }
});
