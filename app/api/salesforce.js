export async function fetchAccountInfo(accountId) {
  try {
    const response = await fetch(`/api/salesforce/account/${accountId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch account information');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching account info:', error);
    throw error;
  }
} 