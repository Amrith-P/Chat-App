import React, {useState} from "react";
import { FaUserPlus } from "react-icons/fa";

const Register = () => {

  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const handleChangeUserData = (e) => {
  const{name,value}=e.target;
  setUserData((prevState)=>({...prevState,[name]:value}));

  }
  const handleAuth=async()=>{
    try{
      alert("Registration Successful");
    } catch (error){
      console.log(error);
    }
  }

  return (
    <section className="flex flex-col justify-center items-center h-[100vh] w-[100%] background-image ">
      <div className="bg-white shadow-lg p-5 rounded-xl h-[30rem] w-[21rem] flex flex-col justify-center items-center">
        <div className="mb-10 ">
          <h1 className="text-center text-[28px] font-bold">Sign Up</h1>
          <p className="text-center text-sm text-gray-400">
            Welcome, Create an account to continue
          </p>
        </div>
        <div className="w-full">
          <input
            type="text"
            name="fullName"
            onChange={ handleChangeUserData}
            className="border border-green-200 w-full p-2 rounded-md bg-[#01aa851d] text-[#004939f3] mb-3 font-medium outline-none"
            placeholder="Full Name"
          />
          <input
            type="text"
            name="email"
            onChange={ handleChangeUserData}

            className="border border-green-200 w-full p-2 rounded-md bg-[#01aa851d] text-[#004939f3] mb-3 font-medium outline-none"
            placeholder="Email"
          />
          <input
            type="text"
            name="password"
            onChange={ handleChangeUserData}

            className="border border-green-200 w-full p-2 rounded-md bg-[#01aa851d] text-[#004939f3] mb-3 font-medium outline-none"
            placeholder="Password"
          />
        </div>
        <div className="w-full">
          <button onClick={handleAuth} className="bg-[#01aa85] text-white font-bold w-full p-2 rounded-md flex items-center gap-2 justify-center ">
            Register <FaUserPlus/>
          </button>
        </div>
        <div className="mt-5 text-center text-gray-400 text-sm">
            Already have an account? Sign in
        </div>
      </div>
    </section>
  );
};

export default Register;
