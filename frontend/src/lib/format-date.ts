export const formatDate = (date: string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  const formattedDate = new Date(date).toLocaleString('en-UK', options);
  return formattedDate;
};

export const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString();
};

export const isValidDate = (date: string): boolean => {
  return !isNaN(Date.parse(date));
};