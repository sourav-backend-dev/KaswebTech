import {
  Button,
  IndexTable,
  ButtonGroup,
  TextField
} from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loader as productsLoader } from "./loaders/getAllProducts";
import './Style/styles.css';

export { productsLoader as loader };

export default function ProductsPage() {
  const { data } = useLoaderData();
  const navigate = useNavigate();
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

 // Filter data based on search term
 const filteredData = data.filter((item) =>
  item.title.toLowerCase().includes(searchTerm.toLowerCase())
);

const currentItems = filteredData.slice(startIndex, endIndex);

const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  const handleViewClick = (id) => {
    navigate(`/app/product/${id}`);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); 
  };

  const rowMarkup = currentItems.map(({ image, id, title }, index) => (
    <IndexTable.Row id={id} key={id} position={index}>
      <IndexTable.Cell>
        {" "}
        <img height={"40px"} src={image.src} />{" "}
      </IndexTable.Cell>
      <IndexTable.Cell>{id}</IndexTable.Cell>
      <IndexTable.Cell> {title} </IndexTable.Cell>
      <IndexTable.Cell>
        {" "}
        <Button
          primary
          onClick={() => handleViewClick(id)}
        >
          View
        </Button>{" "}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));
  return (
    <>
        <div className="search-container">
          <TextField
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by product title"
            autoComplete="off"
          />
        </div>
      <div className="table-container">
        <IndexTable
          itemCount={filteredData.length}
          headings={[
            { title: "Image" },
            { title: "Id" },
            { title: "Title" },
            { title: "Add" },
          ]}
          selectable={false}
        >
          {rowMarkup}
        </IndexTable>
      </div>

      <div className="pagination-container">
        <ButtonGroup segmented>
          <Button
            primary
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous Page
          </Button>
          <span className="page-info">{currentPage} / {totalPages}</span>
          <Button
            primary
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next Page
          </Button>
        </ButtonGroup>
      </div>
    </>
  );
}
