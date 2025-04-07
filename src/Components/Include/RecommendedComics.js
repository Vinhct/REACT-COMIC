// src/Components/Include/RecommendedComics.js
import React from "react";
import Carousel3D from "./Carousel3D";
import { Container } from "react-bootstrap";

const RecommendedComics = ({ comics }) => {
  if (!comics || comics.length === 0) {
    return null;
  }

  return (
    <Container fluid className="py-4">
      <Carousel3D comics={comics} />
    </Container>
  );
};

export default RecommendedComics;
