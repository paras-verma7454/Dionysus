import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const serviceRoleKey= process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY as string;
export const supabase = createClient(supabaseUrl , serviceRoleKey);
export const uploadFile = async (file: File) => {

    // Sanitize the file name by replacing unsafe characters
    let safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    let filePath = `uploads/${safeFileName}`;
    let counter = 1;

    // Check if the file already exists
    const { data: existingFiles } = await supabase.storage.from('audio-files').list('uploads/');

    const existingFileNames = existingFiles?.map(file => file.name);
    

    // Append numbers until a unique filename is found
    while (existingFileNames?.includes(safeFileName)) {
        const nameParts = safeFileName.split('.');
        const extension = nameParts.pop(); // Get the file extension
        const baseName = nameParts.join('.'); // Get the base name
        safeFileName = `${baseName}-${counter}.${extension}`; // Create a new filename
        filePath = `uploads/${safeFileName}`;
        counter++;
    }

    // Upload the file with the unique filename
    const { data, error } = await supabase.storage
        .from('audio-files')
        .upload(filePath, file,{
            contentType: 'audio/*',
        });

    if (error) {
        console.error('Error uploading file:', error);
        return { success: false}; // Return error message
    }

    const { data: { publicUrl: publicURL } } = await supabase.storage
        .from('audio-files')
        .getPublicUrl(filePath);

    if (!publicURL) {
        console.error('Error getting public URL:', publicURL);
        return { success: false, message: 'Error getting public URL' }; // Return error message
    }

    console.log('File uploaded successfully:', publicURL);
    return { success: true, url: publicURL,data }; // Return success status and URL
};