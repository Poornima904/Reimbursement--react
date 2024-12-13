import React, { useState } from "react";
import "./App.css";
import AppBar from "components/AppBar";
import MasterPage from "pages/MasterPage";
import ObjectPage from "pages/ObjectPage";
import ObjectCreate from "pages/ObjectCreate";

const App = () => {
  const [currentView, setCurrentView] = useState("master");
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [masterPageKey, setMasterPageKey] = useState(0); // Key to force remount

  const navigateToObjectPage = (rowData) => {
    setSelectedRowData(rowData);
    setCurrentView("object");
  };

  const navigateToObjectCreate = () => {
    setSelectedRowData(null);
    setCurrentView("create");
  };

  const navigateToMasterPage = () => {
    setCurrentView("master");
    setMasterPageKey((prevKey) => prevKey + 1); // Update key to remount MasterPage
  };

  return (
    <div className="App full-height">
      <AppBar />
      {currentView === "master" ? (
        <MasterPage 
          key={masterPageKey} // Add the key here
          onRowClick={(rowData) => navigateToObjectPage(rowData)} 
          onCreateClick={navigateToObjectCreate} 
        />
      ) : currentView === "object" ? (
        <ObjectPage 
          rowData={selectedRowData} 
          onBack={navigateToMasterPage} 
        />
      ) : (
        <ObjectCreate 
          onBack={navigateToMasterPage} 
          fromCreate={true}
        />
      )}
    </div>
  );
};

export default App;
