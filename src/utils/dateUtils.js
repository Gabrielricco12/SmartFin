import { getHours } from 'date-fns';

export function getGreeting() {
  const currentHour = getHours(new Date());
  
  if (currentHour >= 5 && currentHour < 12) return 'Bom dia';
  if (currentHour >= 12 && currentHour < 18) return 'Boa tarde';
  return 'Boa noite';
}