//import logo from './logo.svg';
import './App.css';
import Home from './Components/Home';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DetailPage from './Components/DetailPage';
import { Genre } from './Components/Genre';
import  DPH  from './Components/dang-phat-hanh'
import HT from './Components/hoan-thanh';
import SRM from './Components/sap-ra-mat';
import  Login  from './Components/Include/Login';    // Import từ Include
import Register  from './Components/Include/Register'; // Import từ Include
import History from './Components/History';
import Search from './Components/Search';

function App() {
  return( 
    <Router>
      <Routes>
        <Route path='/' element={<Home></Home>}></Route>
        <Route path='/comics/:slug' element={<DetailPage></DetailPage>}></Route>
        <Route path='/genre/:slug' element={<Genre></Genre>}></Route>
        <Route path='/dang-phat-hanh' element={<DPH></DPH>}></Route>
        <Route path='/hoan-thanh' element={<HT></HT>}></Route>
        <Route path='/sap-ra-mat' element={<SRM></SRM>}></Route>
        <Route path="/login" element={<Login ></Login>} />
        <Route path="/register" element={<Register />} />
        <Route path="/history" element={<History />} />
        <Route path="/search" element={<Search /> }/>
      </Routes>
    </Router>
  );
}

export default App;
