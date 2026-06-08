

// src/pages/DoctorsPage.jsx
import React, { useEffect, useState } from 'react';
import DoctorTable from '../../components/DoctorTable';
import Pagination from '../../components/Pagination';
import useApi from '../../api/useApi';
import { useLoader } from "../../context/LoaderContext";
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL;

const Doctors = () => {
  const {getData}=useApi()
  const [list, setlist] = useState([])
  const {showLoader,hideLoader}=useLoader()

  
useEffect(() => {
  (async () => {
    try {
      showLoader();
      const res = await axios.get(`${API_BASE_URL || 'https://api.care2connect.in'}/doctor_list`);
      const response = res.data;

      console.log(response)

      // initially, just show doctors with placeholder or direct URL if present
      const base_list = response.map(doc => {
        let pic = 'https://via.placeholder.com/150';
        if (doc.photo && typeof doc.photo === 'string' && (doc.photo.startsWith('http://') || doc.photo.startsWith('https://'))) {
          pic = doc.photo;
        } else if (doc.imageUrl && typeof doc.imageUrl === 'string' && (doc.imageUrl.startsWith('http://') || doc.imageUrl.startsWith('https://'))) {
          pic = doc.imageUrl;
        }
        return {
          ...doc,
          profile_pic: pic
        };
      });

      setlist(base_list);

      // now fetch images one by one in background if they are IDs
      response.forEach(async (doc, index) => {
        const photoId = doc.photo || (doc.documents && doc.documents.photo) || doc.imageUrl;
        if (photoId && typeof photoId === 'string' && !photoId.startsWith('http')) {
          const url = await imageUrl(photoId);
          if (url) {
            setlist(prev =>
              prev.map((d, i) => i === index ? { ...d, profile_pic: url } : d)
            );
          }
        }
      });

    } catch (error) {
      console.error(error);
      showErrorAlert("Failed", "Failed to Retrieve Doctors");
    } finally {
      hideLoader();
    }
  })();
}, []);


  const imageUrl =async(id) => {
      try {
        const response = await fetch(`${API_BASE_URL}/image/${id}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (response.ok) {
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        } else {
          console.error('Failed to fetch image');
          return null;
        }
      } catch (error) {
        console.error('Error fetching image:', error);
        return null;
      }
    }

  
  return (
   <>
      <DoctorTable doctors={list} />
      <Pagination />
    </>
  );
};

export default Doctors;
