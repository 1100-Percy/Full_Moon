import * as mockApi from './mock';
import * as supabaseApi from './supabase';

const api = import.meta.env.VITE_USE_MOCK === 'false' ? supabaseApi : mockApi;

export const getPair = api.getPair;
export const createPair = api.createPair;
export const sendMessage = api.sendMessage;
export const getMessages = api.getMessages;
export const getInboxMessages = api.getInboxMessages;
export const catchMessage = api.catchMessage;
export const onNewMessage = api.onNewMessage;
export const getLitStars = api.getLitStars;
export const getMoonState = api.getMoonState;
export const getSummary = api.getSummary;
export const createTask = api.createTask;
export const uploadTaskPhoto = api.uploadTaskPhoto;
export const verifyTask = api.verifyTask;
