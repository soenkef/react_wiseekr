import Button from 'react-bootstrap/Button';

export default function More({ pagination, loadNextPage }) {
    let theraAreMore = false;
    if (pagination) {
        const { offset, count, total } = pagination;
        theraAreMore = offset + count < total;
    }

    return (
        <div className="More">
            {theraAreMore &&
                <Button variant="outline-primary" onClick={loadNextPage}>
                    More &raquo;
                </Button>
            }
        </div>
    );
}