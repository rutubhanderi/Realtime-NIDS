const Footer = () => (
    <footer className="bg-gray-800 text-gray-400 p-4 mt-auto border-t border-gray-700">
      <div className="container mx-auto text-center">
        <p>© {new Date().getFullYear()} NetGuard</p>
        <p className="text-gray-500 text-sm mt-1">Version 1.0.1</p>
      </div>
    </footer>
  );
  
  export default Footer;
  