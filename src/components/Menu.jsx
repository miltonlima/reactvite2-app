import { Link } from 'react-router-dom'

const routes = [
  { path: "/", label: "Page 1" },
  { path: "/page2", label: "Page 2" },
  { path: "/page3", label: "Page 3" },
  { path: "/page4", label: "Page 4" },
  { path: "/page5", label: "Page 5" },
  { path: "/page6", label: "Page 6" },
  { path: "/page7", label: "Page 7" },
  { path: "/page8", label: "Page 8" }
]

function Menu() {
  const firstRow = routes.slice(0, 4)
  const secondRow = routes.slice(4)

  return (
    <>
      <nav className="menu">
        {firstRow.map(route => (
          <Link key={route.path} to={route.path}>{route.label}</Link>
        ))}
      </nav>
      <nav className="menu">
        {secondRow.map(route => (
          <Link key={route.path} to={route.path}>{route.label}</Link>
        ))}
      </nav>
    </>
  )
}

export default Menu