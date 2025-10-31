import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import { getAllStatusThunk } from '../../../store/status';
import { getAllClientsThunk } from '../../../store/clients';

import { LuSearch } from "react-icons/lu";
import { FaCheck } from "react-icons/fa6";

import './TicketsFilter.scss';

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
                    <small className="title">Status</small>

                    {status && status.map((stat: any) => (
                        <label htmlFor={`cb-status-${stat.id}`} key={stat.id} onClick={() => toggleStatus(stat.id)}>
                            <span className="checkmark" style={{
                                borderColor: stat.color,
                                backgroundColor: selectedStatus.includes(stat.id) ? stat.color : 'transparent'
                            }}>
                                <FaCheck size={12} color='var(--surface-color)' />
                            </span> {stat.name}

                        </label>
                    ))}
                </div>

                <div className="divider"></div>

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

                <div className="divider"></div>

                <div className="filter-block search-filter">
                    <small className="title">Search</small>

                    <div className="search-filter-wrapper">
                        <LuSearch className="search-filter-icon" />
                        <input type="text" placeholder="Title, description, etc..." className="search-tickets-filter-input" value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} />
                    </div>
                </div>

                <div className="divider"></div>

                <div className="actions">
                    <button className="btn btn-clear-filters" onClick={clearFilters}>Clear Filters</button>
                </div>
            </div>
        </div>
    );
}