import "./TopBar.scss";
import ProfileControl from "../ProfileControl";

export default function TopBar() {
    return (
        <div className="top-bar">
            <div className="spacer"></div>
            <ProfileControl />
        </div>
    );
}
