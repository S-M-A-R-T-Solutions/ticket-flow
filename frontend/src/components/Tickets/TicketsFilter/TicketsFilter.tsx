import { useDispatch, useSelector } from 'react-redux';
import './TicketsFilter.scss';
import { useEffect } from 'react';
import { getAllStatusThunk } from '../../../store/status';
import { getAllClientsThunk } from '../../../store/clients';

export default function TicketsFilter() {

    const dispatch = useDispatch();

    const status = useSelector((state: any) => state.status.allStatus);
    const clients = useSelector((state: any) => state.clients.allClients);

    useEffect(() => {
        dispatch(getAllStatusThunk() as any);
        dispatch(getAllClientsThunk(1, 10000) as any);
    }, [dispatch]);

    return (
        <div className="tickets-filter">
            <div className="status-filter">
                {status && status.map((stat: any) => (
                    <label htmlFor={`cb-status-${stat.id}`} key={stat.id}>
                        <input type="checkbox" id={`cb-status-${stat.id}`} value={stat.id} />
                        {stat.name}
                    </label>
                ))}
            </div>

            <div className="client-filter">
                <select name="client_select" id="client-select-filter" className="client-select">
                    <option value="">All</option>

                    {clients && clients.map((client: any) => (
                        client.companyName ?
                            <option key={client.id} value={client.id}>{client.companyName}</option> :
                            <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>
                    ))}
                </select>

            </div>

            <div className="search-filter">
                <input type="text" placeholder="Search tickets..." className="search-tickets-filter-input" />
            </div>
        </div>
    );
}