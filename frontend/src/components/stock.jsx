import React, { useState } from 'react';
import { SearchableSelect, GetDataButton } from './SearchBarSelect';
import StockChart from './stockChart';
import LoadingSpinner from './loadingAnimation';
import { StartDate, EndDate, getAgoDate } from "./DateInput";
import StockDataTable from './stockDataTable';
import stockOptions from "./stockList";
import PredictButton from './predictbutton';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import notifyError from './Notifications';

const StockDataApp = () => {
  const [selectedStock, setSelectedStock] = useState(null);
  const [startDate, setStartDate] = useState(getAgoDate(1));
  const [endDate, setEndDate] = useState(getAgoDate(0));
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = (selectedOption) => {
    setSelectedStock(selectedOption);
  };

  const handleGetData = async () => {
    if (!selectedStock) {
      notifyError("Please select a stock first.");
      return;
    }
    if (startDate > endDate) {
      notifyError("Start date must be earlier than the end date.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:3001/getStockData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stockSymbol: `${selectedStock.symbol}.NS`,
          startDate,
          endDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid stock symbol or API limit reached");
      }

      const data = await response.json();
      const stockSymbol = `${selectedStock.symbol}.NS`;
      const stockData = data.data[stockSymbol];

      if (!stockData) {
        throw new Error("No data available for the selected stock.");
      }

      setStockData(stockData);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative top-0.5 left-0.5 py-4 px-2 mx-10">
      <div className="flex items-center space-x-4 justify-center">
        <SearchableSelect options={stockOptions} onSelect={handleSelect} />
        <StartDate value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <EndDate value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <GetDataButton onClick={handleGetData} />
      </div>
      {loading && <LoadingSpinner />}
      {!loading && stockData && <StockDataTable stockData={stockData} />}
      {!loading && stockData && (
        <div>
          <StockChart stockData={stockData} startDate={startDate} endDate={endDate} selectedStock={selectedStock} />
        </div>
      )}
      {!loading && stockData && (
        <PredictButton startDate={startDate} endDate={endDate} selectedStock={selectedStock} stockData={stockData} />
      )}
      <ToastContainer />
    </div>
  );
};

export default StockDataApp;
