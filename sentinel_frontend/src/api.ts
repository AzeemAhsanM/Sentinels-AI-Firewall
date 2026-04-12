import axios from "axios"

const API = axios.create({
  baseURL: "https://uwqy2amrvl.execute-api.ap-south-1.amazonaws.com"
})

export const setToken = (token:string)=>{
  localStorage.setItem("token", token)
}

API.interceptors.request.use(config=>{
  const token = localStorage.getItem("token")

  if(token){
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default API