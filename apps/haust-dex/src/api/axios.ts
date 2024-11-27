import axios from 'axios';
import { camelCase, isArray, isObject, snakeCase, transform } from 'lodash';


/* eslint-disable @typescript-eslint/no-explicit-any */
const camelize = (obj: any): any => {
  if (typeof obj === 'undefined' || obj == null) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return camelCase(obj);
  }

  return transform(obj, (acc: any, value, key, target) => {
    const camelKey = isArray(target) ? key : camelCase(key.toString());
    acc[camelKey] = isObject(value) ? camelize(value) : value;
  });
};

const decamelize = (obj: any): any => {
  if (typeof obj === 'undefined' || obj == null) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return snakeCase(obj);
  }

  return transform(obj, (acc: any, value, key, target) => {
    const camelKey = isArray(target) ? key : snakeCase(key.toString());
    acc[camelKey] = isObject(value) ? decamelize(value) : value;
  });
};

const API_URL = process.env.REACT_APP_API_URL
if (!API_URL) {
  throw new Error('API URL MISSING FROM ENVIRONMENT')
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  transformRequest: (request) => {
    return JSON.stringify(decamelize(request));
  },
  transformResponse: (response) => {
    return camelize(JSON.parse(response));
  },
  paramsSerializer: {
    serialize: (params) => {
      return new URLSearchParams(decamelize(params)).toString();
    },
  },
});