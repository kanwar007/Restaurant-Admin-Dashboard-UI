export const formatCurrency = (value: number) =>
	new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
