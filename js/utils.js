// 금액 포맷
function formatCurrency(amount) {
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(1) + '억원';
  } else if (amount >= 10000) {
    return (amount / 10000).toFixed(0) + '만원';
  }
  return amount.toLocaleString() + '원';
}
