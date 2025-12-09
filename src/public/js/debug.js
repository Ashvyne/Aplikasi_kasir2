// Debug script untuk troubleshoot

console.log('=== APP DEBUG START ===');
console.log('Current URL:', window.location.href);
console.log('Token exists:', !!localStorage.getItem('token'));

// Check DOM elements
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== DOM READY ===');
  
  const pages = document.querySelectorAll('.page');
  console.log(`Pages found: ${pages.length}`);
  pages.forEach(p => console.log(`  - ${p.id}`));
  
  const navItems = document.querySelectorAll('.nav-item');
  console.log(`Nav items found: ${navItems.length}`);
  navItems.forEach((item, i) => {
    console.log(`  - ${i}: ${item.getAttribute('data-page')} = ${item.textContent.trim()}`);
    item.addEventListener('click', (e) => {
      console.log('CLICKED:', item.getAttribute('data-page'));
    });
  });
});

// Override console.log untuk tracking
const originalLog = console.log;
window.apiCalls = [];
console.log = function(...args) {
  if (args[0]?.includes?.('API') || args[0]?.includes?.('page')) {
    window.apiCalls.push(args);
  }
  originalLog.apply(console, args);
};
