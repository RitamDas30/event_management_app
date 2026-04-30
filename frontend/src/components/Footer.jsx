import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-surface-950 text-surface-400 py-20 lg:py-32 border-t border-surface-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-3 group mb-6 outline-none">
              <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center transition-transform group-hover:scale-105 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
                <span className="font-semibold text-xl text-surface-950 leading-none mt-1.5">
                  E
                </span>
              </div>
              <span className="font-sans font-medium tracking-tight text-surface-50 text-xl">
                Evently
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              A meticulously crafted platform for discovering, creating, and managing campus and community events.
            </p>
          </div>

          <div>
            <h4 className="text-surface-50 font-medium mb-6">Platform</h4>
            <ul className="space-y-4">
              {["Explore", "Features", "Pricing", "About"].map((item) => (
                <li key={item}>
                  <Link to={`/${item.toLowerCase()}`} className="text-sm hover:text-surface-50 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-surface-50 font-medium mb-6">Legal</h4>
            <ul className="space-y-4">
              {["Terms of Service", "Privacy Policy", "Cookie Policy"].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-sm hover:text-surface-50 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-surface-50 font-medium mb-6">Connect</h4>
            <ul className="space-y-4">
              {["Twitter", "GitHub", "Dribbble", "Contact"].map((item) => (
                <li key={item}>
                  <Link to={item === "Contact" ? "/contact" : "#"} className="text-sm hover:text-surface-50 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-24 pt-8 border-t border-surface-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Evently Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
