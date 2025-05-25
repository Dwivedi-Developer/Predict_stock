import React, { useState, useEffect } from "react";
import notifyError from "./Notifications";
import NewsCard from "./Newscard";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

const NewsPage = () => {
  const [newsData, setNewsData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedData = localStorage.getItem("newsData");
        const storedDate = localStorage.getItem("newsDataDate");
        const todayDate = new Date().toISOString().split("T")[0];

        let storedDataInJson = [];

        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const timeSeries = parsedData["Time Series (Daily)"];

          if (timeSeries) {
            storedDataInJson = Object.entries(timeSeries).map(
              ([date, values]) => ({
                date,
                title: `Stock Data - ${date}`,
                author: "Market API",
                content: `Open: ${values["1. open"]}, High: ${values["2. high"]}, Low: ${values["3. low"]}, Close: ${values["4. close"]}, Volume: ${values["5. volume"]}`,
                image: null,
                link: "#",
              })
            );
          }
        }

        if (storedData && todayDate === storedDate && Array.isArray(storedDataInJson)) {
          console.log(storedData);
          setNewsData(storedDataInJson);
          return;
        } else {
          localStorage.removeItem("newsData");
          localStorage.removeItem("newsDataDate");
        }

        const response = await fetch("http://localhost:3001/getnews", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const timeSeries = data.news["Time Series (Daily)"];
          let formattedData = [];

          if (timeSeries) {
            formattedData = Object.entries(timeSeries).map(([date, values]) => ({
              date,
              title: `Stock Data - ${date}`,
              author: "Market API",
              content: `Open: ${values["1. open"]}, High: ${values["2. high"]}, Low: ${values["3. low"]}, Close: ${values["4. close"]}, Volume: ${values["5. volume"]}`,
              image: null,
              link: "#",
            }));
          }

          setNewsData(formattedData);
          localStorage.setItem("newsData", JSON.stringify(data.news));
          localStorage.setItem("newsDataDate", todayDate);
        } else {
          notifyError("Failed to fetch news data.");
        }
      } catch (error) {
        console.error("Error fetching news data:", error);
        notifyError("Error fetching news data.");
      }
    };

    fetchData();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = newsData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (event, value) => setCurrentPage(value);

  return (
    <div className="mt-8">
      <div
        className="news-container"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-evenly",
        }}
      >
        {currentItems.map((newsItem, index) => (
          console.log(newsItem),
          <NewsCard
            key={index}
            title={newsItem.title}
            author={newsItem.author}
            content={newsItem.content}
            date={newsItem.date}
            image={newsItem.image}
            link={newsItem.link}
          />
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: "20px", marginBottom: "60px" }}>
        <Stack spacing={2} direction="row" justifyContent="center">
          <Pagination
            count={Math.ceil(newsData.length / itemsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            variant="outlined"
            shape="rounded"
            sx={{
              "& .MuiPaginationItem-root.Mui-selected": {
                backgroundColor: "#2196f3",
                color: "#fff",
              },
              "& .MuiPaginationItem-root:hover": {
                backgroundColor: "#ccc",
              },
            }}
          />
        </Stack>
      </div>
    </div>
  );
};

export default NewsPage;
