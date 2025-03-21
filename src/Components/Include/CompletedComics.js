// src/Components/Include/CompletedComics.js
import axios from "axios";
import React, { useEffect, useState } from "react";
import ComicList from "./ComicList";

const CompletedComics = () => {
  const [getdata, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://otruyenapi.com/v1/api/danh-sach/hoan-thanh?page=${currentPage}`
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
      sectionTitle="Truyện Hoàn Thành"
      limit={8} // Hiển thị 2 hàng x 4 truyện = 8 truyện
      viewMoreLink="/hoan-thanh" // Đường dẫn cho nút "Xem Thêm"
    />
  );
};

export default CompletedComics;