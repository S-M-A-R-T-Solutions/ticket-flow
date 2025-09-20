import { useModal } from '../../context/Modal';
import './OpenModalMenuItem.css';

function OpenModalMenuItem({
  modalComponent,
  itemText,
  onItemClick,
  onModalClose,
  dismisable,
}) {
  const { setModalContent, setOnModalClose, setDismisable } = useModal();

  const onClick = () => {
    if (onModalClose) setOnModalClose(onModalClose);
    setModalContent(modalComponent);
    setDismisable(dismisable);
    if (typeof onItemClick === "function") onItemClick();
  };

  return (
    <li className="open-modal-menu-item" onClick={onClick}>
      {itemText}
    </li>
  );
}

export default OpenModalMenuItem;
