import "./TopBar.scss";
import SearchBar from "../SearchBar/SearchBar";
import ProfileControl from "../ProfileControl";

export default function TopBar() {
    return (
        <div className="top-bar">
            <div className="search-bar-wrapper">
                <SearchBar />
            </div>

            <div className="spacer"></div>

            <ProfileControl />
        </div>
    );
}
