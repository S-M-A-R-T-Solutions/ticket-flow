import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import { getAllStatusThunk } from '../../../store/status';
import { getAllClientsThunk } from '../../../store/clients';

import { LuSearch } from "react-icons/lu";
import { FaCheck, FaTicket } from "react-icons/fa6";

import './TicketsFilter.scss';

const STATUS: [{ id: number; name: string; color: string }, { id: number; name: string; color: string }, { id: number; name: string; color: string }, { id: number; name: string; color: string }] = [
    { id: 1, name: 'Open', color: '#FF6B6B' },
    { id: 2, name: 'In Progress', color: '#FFB84C' },
    { id: 3, name: 'Closed', color: '#4CAF50' },
    { id: 4, name: 'Pending', color: '#7C3AED' },
];

interface TicketsFilterProps {
    selectedStatus: number[];
    selectedClient: number | null;
    searchFilter: string;
    toggleStatus: (status: number) => void;
    clearFilters: () => void;
    setSelectedClient: (clientId: number | null) => void;
    setSearchFilter: (searchTerm: string) => void;
}

export default function TicketsFilter({
    selectedStatus,
    toggleStatus,
    selectedClient,
    setSelectedClient,
    searchFilter,
    setSearchFilter,
    clearFilters,
}: TicketsFilterProps) {

    const dispatch = useDispatch();

    const status = useSelector((state: any) => state.status.allStatus);
    const clients = useSelector((state: any) => state.clients.allClients);

    const [selectedClientLocal, setSelectedClientLocal] = useState<number | ''>('');

    useEffect(() => {
        dispatch(getAllStatusThunk() as any);
        dispatch(getAllClientsThunk(1, 10000) as any);
    }, [dispatch]);

    useEffect(() => {
        setSelectedClientLocal(selectedClient || '');
    }, [selectedClient]);

    return (
        <div className="tickets-filter-wrapper">
            <div className="tickets-filter">
                <div className="filter-block status-filter">
                    <div className='status-list-status-list'>
                        {STATUS && STATUS.map((stat: any) => (
                            <div className='status-ticket' key={stat.id} onClick={() => toggleStatus(stat.id)}>
                                <FaTicket 
                                    className={`status-icon${selectedStatus.includes(stat.id) ? 'hovered' : ''}`} 
                                    style={{ color: selectedStatus.includes(stat.id) ? stat.color : `${stat.color}A1`, fontSize: "64px" }} 
                                    />
                                <span className={`status-name${selectedStatus.includes(stat.id) ? ' selected' : ''}`}>{stat.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="filter-block client-filter">
                    <small className="title">Client</small>

                    <select name="client_select" id="client-select-filter" className="client-select" value={selectedClientLocal} onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                            setSelectedClient(null);
                        } else {
                            setSelectedClient(Number(value));
                        }
                    }}>
                        <option value="">All</option>

                        {clients && clients.map((client: any) => (
                            client.companyName ?
                                <option key={client.id} value={client.id}>{client.companyName}</option> :
                                <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>
                        ))}
                    </select>

                </div>

                {/* <div className="divider"></div> */}

                <div className="filter-block search-filter">
                    <small className="title">Search</small>

                    <div className="search-filter-wrapper">
                        <LuSearch className="search-filter-icon" />
                        <input type="text" placeholder="Title, description, etc..." className="search-tickets-filter-input" value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} />
                    </div>
                </div>

                {/* <div className="divider"></div> */}

                <div className="actions">
                    <button className="btn btn-clear-filters" onClick={clearFilters}>Clear Filters</button>
                </div>
            </div>
        </div>
    );
}