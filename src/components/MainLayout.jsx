import Main from "./Main";
import SideNav from "./SideNav";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function MainLayout() {
  return (
    <div className="h-screen flex h-[90vh] bg-blue-200">
      <Main />
      <ToastContainer position="bottom-right" autoClose={3000} toastClassName={() =>
          "relative flex p-4 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer bg-dark-500  text-light-200"
        }
        progressClassName="!bg-blue-400 "
        closeButton={false}
        
        />

        
    </div>
  );
}
