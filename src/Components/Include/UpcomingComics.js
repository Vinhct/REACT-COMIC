// src/Components/Include/UpcomingComics.js
import axios from "axios";
import React, { useEffect, useState } from "react";
import ComicList from "./ComicList";

const UpcomingComics = () => {
  const [getdata, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://otruyenapi.com/v1/api/danh-sach/sap-ra-mat?page=${currentPage}`
        );
        setData(response.data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage]);

  if (error) {
    return <div className="text-center text-danger">Error: {error}</div>;
  }

  const items = getdata?.data?.items;

  return (
    <ComicList
      items={items}
      loading={loading}
      sectionTitle="Truyện Sắp Ra Mắt"
      limit={8} // Hiển thị 2 hàng x 4 truyện = 8 truyện
      viewMoreLink="/sap-ra-mat" // Đường dẫn cho nút "Xem Thêm"
    />
  );
};

export default UpcomingComics;