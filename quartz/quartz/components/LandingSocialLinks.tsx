import { JSX } from "preact"
import { classNames } from "../util/lang"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

type SocialLink = {
  label: string
  href: string
  className: string
  icon: JSX.Element
}

const socialLinks: SocialLink[] = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/ritesh-kumar-phd",
    className: "linkedin",
    icon: <span class="icon-text">in</span>,
  },
  {
    label: "Google Scholar",
    href: "https://scholar.google.com/citations?hl=en&user=GR3BoyYAAAAJ",
    className: "scholar",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 1 9l11 6 9-4.91V17h2V9z" />
        <path d="M6 13.2V17a6 3.5 0 0 0 12 0v-3.8l-6 3.27z" />
      </svg>
    ),
  },
  {
    label: "ORCID",
    href: "https://orcid.org/0000-0001-6345-6791",
    className: "orcid",
    icon: <span class="icon-text">iD</span>,
  },
  {
    label: "GitHub",
    href: "https://github.com/IE2Lab",
    // href: "https://github.com/ritesh001",
    className: "github",
    icon: (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.34c-2.24.49-2.71-1.08-2.71-1.08-.36-.93-.89-1.18-.89-1.18-.73-.5.06-.49.06-.49.81.06 1.23.83 1.23.83.72 1.23 1.9.88 2.36.67.07-.52.28-.88.51-1.08-1.79-.2-3.67-.89-3.67-3.95 0-.87.31-1.58.82-2.14-.08-.2-.35-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.43 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.14 0 3.07-1.89 3.75-3.69 3.95.29.25.54.74.54 1.49v2.2c0 .21.14.46.55.38A8 8 0 0 0 8 0" />
      </svg>
    ),
  },
]

const LandingSocialLinks: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <div class={classNames(displayClass, "landing-social-links")} aria-label="Social links">
      {socialLinks.map((link) => (
        <a
          href={link.href}
          class={`social-icon ${link.className}`}
          aria-label={link.label}
          title={link.label}
          target="_blank"
          rel="noopener noreferrer me"
        >
          {link.icon}
        </a>
      ))}
    </div>
  )
}

LandingSocialLinks.css = `
.landing-social-links {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  margin: 0 0 1rem;
}

.landing-social-links .social-icon {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: transform 0.12s ease, opacity 0.12s ease;
}

.landing-social-links .social-icon:hover {
  transform: translateY(-1px);
  opacity: 0.92;
}

.landing-social-links .social-icon:focus-visible {
  outline: 2px solid var(--secondary);
  outline-offset: 2px;
}

.landing-social-links .social-icon svg {
  width: 1.05rem;
  height: 1.05rem;
  fill: currentColor;
}

.landing-social-links .icon-text {
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
}

.landing-social-links .linkedin { background: #0a66c2; }
.landing-social-links .scholar { background: #4285f4; }
.landing-social-links .orcid { background: #a6ce39; color: #1f3d00; }
.landing-social-links .github { background: #24292f; }
`

export default (() => LandingSocialLinks) satisfies QuartzComponentConstructor
