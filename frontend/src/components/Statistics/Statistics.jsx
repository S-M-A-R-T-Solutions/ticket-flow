import { FaTicket } from "react-icons/fa6";
import { useState } from "react";

import './Statistics.css';

export default function Statistics({ myTickets, status }) {

    const newTickets = myTickets?.filter(ticket => ticket.statusId === status?.filter(status => status.name === 'Open')[0]?.id).length;
    const inProgress = myTickets?.filter(ticket => ticket.statusId === status?.filter(status => status.name === 'In Progress')[0]?.id).length;
    const pending = myTickets?.filter(ticket => ticket.statusId === status?.filter(status => status.name === 'Pending')[0]?.id).length;
    const completed = myTickets?.filter(ticket => ticket.statusId === status?.filter(status => status.name === 'Closed')[0]?.id).length;

    const tabs = [
        { title: 'Today', key: 'today' },
        { title: 'All', key: 'all' },
    ];

    const [selectedTab, setSelectedTab] = useState(tabs[0].key);

    if (!myTickets || !status) return (
        <section>
            <span>loading...</span>
        </section>
    )

    return (
        <section className="statistics-tab">
            <h1>Insights</h1>

            <div className="tabs-container">
                {tabs.map((tab) => (
                    <div className={`tab-item ${selectedTab === tab.key ? 'active' : ''}`} key={tab.key} onClick={() => setSelectedTab(tab.key)}>
                        {tab.title}
                    </div>
                ))}
            </div>

            {selectedTab === 'all' && (
                <div className="tickets-insights-container">
                    <div className="new-tickets-container">
                        <div className="left-side">
                            <h2>New Tickets</h2>
                            <span>{newTickets}</span>
                        </div>
                        <FaTicket style={{ fontSize: "60px", color: `${status[0]?.color}A1` }} />
                    </div>
                    <div className="in-progress-tickets-container">
                        <div className="left-side">
                            <h2>In Progress</h2>
                            <span>{inProgress}</span>
                        </div>
                        <FaTicket style={{ fontSize: "60px", color: `${status[1]?.color}A1` }} />
                    </div>
                    <div className="pending-tickets-container">
                        <div className="left-side">
                            <h2>Pending</h2>
                            <span>{pending}</span>
                        </div>
                        <FaTicket style={{ fontSize: "60px", color: `${status[2]?.color}A1` }} />
                    </div>
                    <div className="done-tickets-container">
                        <div className="left-side">
                            <h2>Done Tickets</h2>
                            <span>{completed}</span>
                        </div>
                        <FaTicket style={{ fontSize: "60px", color: `${status[3]?.color}A1` }} />
                    </div>
                </div>
            )}
        </section>
    );
}