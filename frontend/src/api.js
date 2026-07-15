import axios from 'axios';

const baseURL = `${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/api`;
const api = axios.create({ baseURL });

export const uploadLecture = (file, title) => {
  const form = new FormData();
  form.append('audio', file);
  if (title) form.append('title', title);
  return api.post('/lectures/upload', form).then((res) => res.data);
};

export const uploadNotes = ({ title, notes, file }) => {
  const form = new FormData();
  if (file) form.append('notesFile', file);
  if (notes) form.append('notes', notes);
  if (title) form.append('title', title);
  return api.post('/lectures/upload-notes', form).then((res) => res.data);
};

export const getLecture = (id) => api.get(`/lectures/${id}`).then((res) => res.data);

export const listLectures = () => api.get('/lectures').then((res) => res.data);

export default api;
