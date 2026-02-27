import { pathToRoot } from "../util/path"
import { classNames } from "../util/lang"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const ProfileImage: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const baseDir = pathToRoot(fileData.slug!)

  return (
    <div class={classNames(displayClass, "profile-image-container")}>
      <img
        class="profile-image"
        src={`${baseDir}/images/headshot.jpg`}
        alt="Ritesh Kumar"
        loading="lazy"
      />
    </div>
  )
}

ProfileImage.css = `
.profile-image-container {
  display: flex;
  justify-content: center;
  margin: 1rem 0 1.25rem;
}

.profile-image {
  width: 180px;
  height: 180px;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid var(--lightgray);
}
`

export default (() => ProfileImage) satisfies QuartzComponentConstructor
