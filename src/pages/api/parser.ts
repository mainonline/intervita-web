const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export const parseResume = async (file: File) => {
  try {
    // Create a FormData object to properly send the file
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${apiUrl}/resume/parse/`, {
      method: "POST",
      body: formData,
      // No need to set Content-Type header as it will be automatically set with boundary
    });
    
    if (!response.ok) {
      throw new Error(`Resume parsing failed with status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw error;
  }
};